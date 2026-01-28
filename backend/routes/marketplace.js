// ==========================================
// 🛒 NeuroCoin Marketplace API
// ==========================================
// Global and server-specific marketplace for trading items with NRC

const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

// ==========================================
// GET /api/marketplace/global
// Get all global marketplace listings
// ==========================================
router.get('/global', async (req, res) => {
    try {
        const { type, rarity, minPrice, maxPrice, search, sort, page = 1, limit = 20 } = req.query;
        
        const response = await axios.get(`${BOT_API_URL}/api/bot/marketplace/global`, {
            headers: { 'x-api-key': BOT_API_KEY },
            params: { type, rarity, minPrice, maxPrice, search, sort, page, limit },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[Marketplace] Error fetching global listings:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch global marketplace listings'
        });
    }
});

// ==========================================
// GET /api/marketplace/server/:guildId
// Get server-specific marketplace listings
// ==========================================
router.get('/server/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { type, rarity, minPrice, maxPrice, search, sort, page = 1, limit = 20 } = req.query;
        
        const response = await axios.get(`${BOT_API_URL}/api/bot/marketplace/server/${guildId}`, {
            headers: { 'x-api-key': BOT_API_KEY },
            params: { type, rarity, minPrice, maxPrice, search, sort, page, limit },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[Marketplace] Error fetching server listings:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch server marketplace listings'
        });
    }
});

// ==========================================
// POST /api/marketplace/list
// Create a new marketplace listing
// ==========================================
router.post('/list', async (req, res) => {
    try {
        const { userId, item, price, guildId } = req.body;
        
        if (!userId || !item || !price) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, item, price'
            });
        }
        
        const response = await axios.post(`${BOT_API_URL}/api/bot/marketplace/list`, {
            userId,
            item,
            price,
            guildId
        }, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[Marketplace] Error creating listing:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to create marketplace listing'
        });
    }
});

// ==========================================
// POST /api/marketplace/purchase/:listingId
// Purchase a marketplace item
// ==========================================
router.post('/purchase/:listingId', async (req, res) => {
    try {
        const { listingId } = req.params;
        const { buyerId } = req.body;
        
        if (!buyerId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: buyerId'
            });
        }
        
        const response = await axios.post(`${BOT_API_URL}/api/bot/marketplace/purchase/${listingId}`, {
            buyerId
        }, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[Marketplace] Error purchasing item:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to purchase item'
        });
    }
});

// ==========================================
// DELETE /api/marketplace/listing/:listingId
// Cancel a marketplace listing
// ==========================================
router.delete('/listing/:listingId', async (req, res) => {
    try {
        const { listingId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: userId'
            });
        }
        
        const response = await axios.delete(`${BOT_API_URL}/api/bot/marketplace/listing/${listingId}`, {
            headers: { 'x-api-key': BOT_API_KEY },
            data: { userId },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[Marketplace] Error canceling listing:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to cancel listing'
        });
    }
});

// ==========================================
// GET /api/marketplace/user/:userId
// Get user's marketplace listings
// ==========================================
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { status = 'active' } = req.query;
        
        const response = await axios.get(`${BOT_API_URL}/api/bot/marketplace/user/${userId}`, {
            headers: { 'x-api-key': BOT_API_KEY },
            params: { status },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[Marketplace] Error fetching user listings:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user listings'
        });
    }
});

// ==========================================
// GET /api/marketplace/transactions/:userId
// Get user's transaction history
// ==========================================
router.get('/transactions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;
        
        const response = await axios.get(`${BOT_API_URL}/api/bot/marketplace/transactions/${userId}`, {
            headers: { 'x-api-key': BOT_API_KEY },
            params: { limit },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[Marketplace] Error fetching transactions:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transaction history'
        });
    }
});

// ==========================================
// POST /api/marketplace/offer
// Make an offer on a listing (P2P trading)
// ==========================================
router.post('/offer', async (req, res) => {
    try {
        const { listingId, buyerId, offerAmount, message } = req.body;
        
        if (!listingId || !buyerId || !offerAmount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: listingId, buyerId, offerAmount'
            });
        }
        
        const response = await axios.post(`${BOT_API_URL}/api/bot/marketplace/offer`, {
            listingId,
            buyerId,
            offerAmount,
            message
        }, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[Marketplace] Error making offer:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to make offer'
        });
    }
});

// ==========================================
// GET /api/marketplace/config/:guildId
// Get server marketplace configuration
// ==========================================
router.get('/config/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        
        const response = await axios.get(`${BOT_API_URL}/api/bot/marketplace/config/${guildId}`, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[Marketplace] Error fetching config:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch marketplace config'
        });
    }
});

// ==========================================
// POST /api/marketplace/config/:guildId
// Update server marketplace configuration
// ==========================================
router.post('/config/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { config } = req.body;
        
        if (!config) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: config'
            });
        }
        
        const response = await axios.post(`${BOT_API_URL}/api/bot/marketplace/config/${guildId}`, {
            config
        }, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[Marketplace] Error updating config:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to update marketplace config'
        });
    }
});

// ==========================================
// GET /api/marketplace/main
// Get main store products (site-provided)
// ==========================================
router.get('/main', async (req, res) => {
    try {
        const { MarketplaceProduct } = require('../models/MarketplaceProduct');
        
        const {
            category,
            minPrice,
            maxPrice,
            search,
            sort = 'newest',
            page = 1,
            limit = 20
        } = req.query;

        // Build query
        const query = {
            storeType: 'main',
            isActive: true,
            isPublished: true
        };

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseInt(minPrice);
            if (maxPrice) query.price.$lte = parseInt(maxPrice);
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort
        let sortQuery = {};
        switch (sort) {
            case 'oldest':
                sortQuery = { publishedAt: 1 };
                break;
            case 'price-high':
                sortQuery = { price: -1 };
                break;
            case 'price-low':
                sortQuery = { price: 1 };
                break;
            case 'popular':
                sortQuery = { purchases: -1 };
                break;
            case 'newest':
            default:
                sortQuery = { publishedAt: -1 };
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            MarketplaceProduct.find(query)
                .sort(sortQuery)
                .skip(skip)
                .limit(parseInt(limit)),
            MarketplaceProduct.countDocuments(query)
        ]);

        res.json({
            success: true,
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('[Marketplace] Error fetching main store:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch main store products'
        });
    }
});

// ==========================================
// GET /api/marketplace/servers
// List servers with marketplace stores
// ==========================================
router.get('/servers', async (req, res) => {
    try {
        const { MarketplaceProduct } = require('../models/MarketplaceProduct');
        const { search, page = 1, limit = 20 } = req.query;

        // Build aggregation pipeline
        const pipeline = [
            {
                $match: {
                    storeType: 'server',
                    isActive: true,
                    isPublished: true
                }
            },
            {
                $group: {
                    _id: '$guildId',
                    guildName: { $first: '$guildName' },
                    guildIcon: { $first: '$guildIcon' },
                    productCount: { $sum: 1 },
                    totalSales: { $sum: '$purchases' },
                    avgPrice: { $avg: '$price' }
                }
            },
            {
                $sort: { productCount: -1 }
            }
        ];

        // Add search if provided
        if (search) {
            pipeline.unshift({
                $match: {
                    guildName: { $regex: search, $options: 'i' }
                }
            });
        }

        // Execute aggregation
        const servers = await MarketplaceProduct.aggregate(pipeline);

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedServers = servers.slice(skip, skip + parseInt(limit));

        res.json({
            success: true,
            servers: paginatedServers,
            pagination: {
                total: servers.length,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(servers.length / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('[Marketplace] Error fetching servers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch servers'
        });
    }
});

// ==========================================
// GET /api/marketplace/server/:guildId/products
// Get server store products
// ==========================================
router.get('/server/:guildId/products', async (req, res) => {
    try {
        const { MarketplaceProduct } = require('../models/MarketplaceProduct');
        const { guildId } = req.params;
        const {
            category,
            minPrice,
            maxPrice,
            search,
            sort = 'newest',
            page = 1,
            limit = 20
        } = req.query;

        // Build query
        const query = {
            storeType: 'server',
            guildId,
            isActive: true,
            isPublished: true
        };

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseInt(minPrice);
            if (maxPrice) query.price.$lte = parseInt(maxPrice);
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort
        let sortQuery = {};
        switch (sort) {
            case 'oldest':
                sortQuery = { publishedAt: 1 };
                break;
            case 'price-high':
                sortQuery = { price: -1 };
                break;
            case 'price-low':
                sortQuery = { price: 1 };
                break;
            case 'popular':
                sortQuery = { purchases: -1 };
                break;
            case 'newest':
            default:
                sortQuery = { publishedAt: -1 };
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total, guildInfo] = await Promise.all([
            MarketplaceProduct.find(query)
                .sort(sortQuery)
                .skip(skip)
                .limit(parseInt(limit)),
            MarketplaceProduct.countDocuments(query),
            MarketplaceProduct.findOne({ guildId, isPublished: true })
                .select('guildName guildIcon')
        ]);

        res.json({
            success: true,
            guild: guildInfo ? {
                id: guildId,
                name: guildInfo.guildName,
                icon: guildInfo.guildIcon
            } : null,
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('[Marketplace] Error fetching server store:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch server store products'
        });
    }
});

// ==========================================
// POST /api/marketplace/purchase/:productId
// Purchase a marketplace product
// ==========================================
router.post('/purchase/:productId', async (req, res) => {
    try {
        const { MarketplaceProduct, MarketplaceOrder } = require('../models/MarketplaceProduct');
        const { UserNRCData, Transaction } = require('../models/NRC');
        const { nanoid } = require('nanoid');
        const { productId } = req.params;
        const { buyerId } = req.body;

        if (!buyerId) {
            return res.status(400).json({
                success: false,
                error: 'Buyer ID is required'
            });
        }

        // Get product
        const product = await MarketplaceProduct.findOne({ productId });

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        if (!product.isActive || !product.isPublished) {
            return res.status(400).json({
                success: false,
                error: 'Product is not available'
            });
        }

        // Get buyer
        const buyer = await UserNRCData.findOne({ userId: buyerId });

        if (!buyer) {
            return res.status(404).json({
                success: false,
                error: 'Buyer not found'
            });
        }

        // Check balance
        if (buyer.balance < product.price) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient balance'
            });
        }

        // Get seller
        const seller = await UserNRCData.findOne({ userId: product.ownerId });

        if (!seller) {
            return res.status(404).json({
                success: false,
                error: 'Seller not found'
            });
        }

        // Create order
        const orderId = `ORD_${nanoid(12)}`;
        const order = new MarketplaceOrder({
            orderId,
            productId,
            buyerId,
            buyerUsername: buyer.discordUsername,
            sellerId: product.ownerId,
            sellerUsername: seller.discordUsername,
            guildId: product.guildId,
            guildName: product.guildName,
            productSnapshot: {
                title: product.title,
                description: product.description,
                category: product.category,
                icon: product.icon,
                images: product.images,
                deliveryType: product.deliveryType,
                deliveryData: product.deliveryData
            },
            price: product.price,
            status: 'pending'
        });

        // Create NRC transaction (deduct from buyer)
        const transactionId = `TXN_${nanoid(12)}`;
        const transaction = new Transaction({
            transactionId,
            userId: buyerId,
            type: 'marketplace_purchase',
            amount: -product.price,
            balanceBefore: buyer.balance,
            balanceAfter: buyer.balance - product.price,
            metadata: {
                orderId,
                productId,
                productTitle: product.title,
                sellerId: product.ownerId
            }
        });

        // Update buyer balance
        buyer.balance -= product.price;
        buyer.totalSpent += product.price;

        // Update seller balance
        seller.balance += product.price;
        seller.totalEarned += product.price;

        // Update product stats
        product.purchases += 1;
        product.totalRevenue += product.price;
        product.views += 1;

        // Save all
        await Promise.all([
            order.save(),
            transaction.save(),
            buyer.save(),
            seller.save(),
            product.save()
        ]);

        // Create seller transaction
        const sellerTransactionId = `TXN_${nanoid(12)}`;
        const sellerTransaction = new Transaction({
            transactionId: sellerTransactionId,
            userId: product.ownerId,
            type: 'marketplace_sale',
            amount: product.price,
            balanceBefore: seller.balance - product.price,
            balanceAfter: seller.balance,
            metadata: {
                orderId,
                productId,
                productTitle: product.title,
                buyerId
            }
        });
        await sellerTransaction.save();

        order.transactionId = transactionId;
        await order.save();

        // Emit socket events
        const io = req.app.get('io');
        if (io) {
            // Notify seller
            io.to(product.ownerId).emit('marketplace:product:purchased', {
                orderId,
                productId,
                productTitle: product.title,
                buyerUsername: buyer.discordUsername,
                price: product.price
            });
        }

        res.json({
            success: true,
            order,
            message: 'Purchase successful'
        });
    } catch (error) {
        console.error('[Marketplace] Error processing purchase:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process purchase'
        });
    }
});

module.exports = router;

