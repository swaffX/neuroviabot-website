// ==========================================
// Marketplace Product Requests API
// ==========================================
// Routes for guild owners to create and manage product requests

const express = require('express');
const router = express.Router();
const { PendingProductRequest, MarketplaceProduct } = require('../models/MarketplaceProduct');
const { nanoid } = require('nanoid');

// ==========================================
// POST /api/marketplace/requests
// Create a new product request
// ==========================================
router.post('/requests', async (req, res) => {
  try {
    const {
      guildId,
      guildName,
      guildIcon,
      createdBy,
      creatorUsername,
      creatorAvatar,
      category,
      title,
      icon,
      images,
      description,
      price,
      seller,
      deliveryType,
      deliveryData
    } = req.body;

    // Validation
    if (!guildId || !createdBy || !category || !title || !description || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Price validation
    if (price < 10 || price > 100000) {
      return res.status(400).json({
        success: false,
        error: 'Price must be between 10 and 100,000 NRC'
      });
    }

    // Check rate limit: Max 3 pending requests per guild
    const pendingCount = await PendingProductRequest.countDocuments({
      guildId,
      status: 'pending'
    });

    if (pendingCount >= 3) {
      return res.status(429).json({
        success: false,
        error: 'Maximum 3 pending requests allowed per guild'
      });
    }

    // Check daily limit: Max 5 requests per guild per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyCount = await PendingProductRequest.countDocuments({
      guildId,
      createdAt: { $gte: today }
    });

    if (dailyCount >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Maximum 5 product requests per day'
      });
    }

    // Create request
    const requestId = `REQ_${nanoid(12)}`;
    const request = new PendingProductRequest({
      requestId,
      guildId,
      guildName,
      guildIcon,
      createdBy,
      creatorUsername,
      creatorAvatar,
      category,
      title,
      icon,
      images: images || [],
      description,
      price,
      seller,
      deliveryType: deliveryType || 'manual',
      deliveryData: deliveryData || {},
      status: 'pending'
    });

    await request.save();

    // Emit socket event to developers
    const io = req.app.get('io');
    if (io) {
      io.emit('marketplace:request:created', {
        requestId,
        guildName,
        title,
        price,
        category,
        createdAt: request.createdAt
      });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error('[Marketplace] Error creating request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product request'
    });
  }
});

// ==========================================
// GET /api/marketplace/requests/:guildId
// Get all requests for a guild
// ==========================================
router.get('/requests/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { status } = req.query;

    const query = { guildId };
    if (status) {
      query.status = status;
    }

    const requests = await PendingProductRequest.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('[Marketplace] Error fetching requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests'
    });
  }
});

// ==========================================
// GET /api/marketplace/requests/:guildId/pending
// Get pending requests for a guild
// ==========================================
router.get('/requests/:guildId/pending', async (req, res) => {
  try {
    const { guildId } = req.params;

    const requests = await PendingProductRequest.find({
      guildId,
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
      count: requests.length
    });
  } catch (error) {
    console.error('[Marketplace] Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending requests'
    });
  }
});

// ==========================================
// GET /api/marketplace/requests/:guildId/approved
// Get approved but unpublished products for a guild
// ==========================================
router.get('/requests/:guildId/approved', async (req, res) => {
  try {
    const { guildId } = req.params;

    const products = await MarketplaceProduct.find({
      guildId,
      isPublished: false,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('[Marketplace] Error fetching approved products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approved products'
    });
  }
});

// ==========================================
// GET /api/marketplace/request/:requestId
// Get single request by ID
// ==========================================
router.get('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await PendingProductRequest.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error('[Marketplace] Error fetching request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch request'
    });
  }
});

// ==========================================
// PUT /api/marketplace/request/:requestId
// Update request (only if pending)
// ==========================================
router.put('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const updates = req.body;

    const request = await PendingProductRequest.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update request after review'
      });
    }

    // Update fields
    const allowedFields = ['title', 'icon', 'images', 'description', 'price', 'seller', 'deliveryType', 'deliveryData'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        request[field] = updates[field];
      }
    });

    await request.save();

    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error('[Marketplace] Error updating request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update request'
    });
  }
});

// ==========================================
// DELETE /api/marketplace/request/:requestId
// Cancel request (only if pending)
// ==========================================
router.delete('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await PendingProductRequest.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel request after review'
      });
    }

    await PendingProductRequest.deleteOne({ requestId });

    res.json({
      success: true,
      message: 'Request cancelled successfully'
    });
  } catch (error) {
    console.error('[Marketplace] Error deleting request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel request'
    });
  }
});

// ==========================================
// POST /api/marketplace/product/:productId/publish
// Publish approved product
// ==========================================
router.post('/product/:productId/publish', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await MarketplaceProduct.findOne({ productId });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (product.isPublished) {
      return res.status(400).json({
        success: false,
        error: 'Product is already published'
      });
    }

    product.isPublished = true;
    product.publishedAt = new Date();
    await product.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('marketplace:product:published', {
        productId,
        guildId: product.guildId,
        title: product.title,
        price: product.price
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('[Marketplace] Error publishing product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish product'
    });
  }
});

// ==========================================
// POST /api/marketplace/product/:productId/unpublish
// Unpublish product
// ==========================================
router.post('/product/:productId/unpublish', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await MarketplaceProduct.findOne({ productId });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    product.isPublished = false;
    await product.save();

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('[Marketplace] Error unpublishing product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unpublish product'
    });
  }
});

module.exports = router;

