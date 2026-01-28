// ==========================================
// Developer Marketplace Management API
// ==========================================
// Routes for developers to approve/deny product requests

const express = require('express');
const router = express.Router();
const { PendingProductRequest, MarketplaceProduct } = require('../models/MarketplaceProduct');
const { nanoid } = require('nanoid');
const { isDeveloper } = require('../middleware/developerAuth');

// Apply developer authentication to all routes
router.use(isDeveloper);

// ==========================================
// GET /api/dev/marketplace/pending
// Get all pending requests with filters
// ==========================================
router.get('/marketplace/pending', async (req, res) => {
  try {
    const { 
      status = 'pending',
      guildId,
      category,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (guildId) {
      query.guildId = guildId;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Build sort
    let sortQuery = {};
    switch (sort) {
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'price-high':
        sortQuery = { price: -1 };
        break;
      case 'price-low':
        sortQuery = { price: 1 };
        break;
      case 'newest':
      default:
        sortQuery = { createdAt: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, total] = await Promise.all([
      PendingProductRequest.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit)),
      PendingProductRequest.countDocuments(query)
    ]);

    res.json({
      success: true,
      requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Dev Marketplace] Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending requests'
    });
  }
});

// ==========================================
// POST /api/dev/marketplace/approve/:requestId
// Approve a product request
// ==========================================
router.post('/marketplace/approve/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reviewNote } = req.body;
    const reviewerId = req.session?.passport?.user?.id || 'SYSTEM';

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
        error: 'Request has already been reviewed'
      });
    }

    // Update request status
    request.status = 'approved';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote || 'Approved';
    await request.save();

    // Create approved product (unpublished)
    const productId = `PROD_${nanoid(12)}`;
    const product = new MarketplaceProduct({
      productId,
      requestId,
      storeType: 'server', // Server stores only for now
      guildId: request.guildId,
      guildName: request.guildName,
      guildIcon: request.guildIcon,
      ownerId: request.createdBy,
      ownerUsername: request.creatorUsername,
      category: request.category,
      title: request.title,
      icon: request.icon,
      images: request.images,
      description: request.description,
      price: request.price,
      seller: request.seller,
      deliveryType: request.deliveryType,
      deliveryData: request.deliveryData,
      isActive: true,
      isPublished: false, // Owner must publish
      isFeatured: false,
      views: 0,
      purchases: 0,
      totalRevenue: 0
    });

    await product.save();

    // Emit socket event to guild owner
    const io = req.app.get('io');
    if (io) {
      io.to(request.createdBy).emit('marketplace:request:approved', {
        requestId,
        productId,
        title: request.title,
        reviewNote: request.reviewNote,
        approvedAt: request.reviewedAt
      });
    }

    res.json({
      success: true,
      request,
      product,
      message: 'Request approved successfully'
    });
  } catch (error) {
    console.error('[Dev Marketplace] Error approving request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve request'
    });
  }
});

// ==========================================
// POST /api/dev/marketplace/deny/:requestId
// Deny a product request
// ==========================================
router.post('/marketplace/deny/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reviewNote } = req.body;
    const reviewerId = req.session?.passport?.user?.id || 'SYSTEM';

    if (!reviewNote) {
      return res.status(400).json({
        success: false,
        error: 'Review note is required for denial'
      });
    }

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
        error: 'Request has already been reviewed'
      });
    }

    // Update request status
    request.status = 'denied';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote;
    await request.save();

    // Emit socket event to guild owner
    const io = req.app.get('io');
    if (io) {
      io.to(request.createdBy).emit('marketplace:request:denied', {
        requestId,
        title: request.title,
        reviewNote: request.reviewNote,
        deniedAt: request.reviewedAt
      });
    }

    res.json({
      success: true,
      request,
      message: 'Request denied successfully'
    });
  } catch (error) {
    console.error('[Dev Marketplace] Error denying request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deny request'
    });
  }
});

// ==========================================
// GET /api/dev/marketplace/stats
// Get marketplace statistics
// ==========================================
router.get('/marketplace/stats', async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      deniedRequests,
      totalProducts,
      publishedProducts,
      totalOrders
    ] = await Promise.all([
      PendingProductRequest.countDocuments(),
      PendingProductRequest.countDocuments({ status: 'pending' }),
      PendingProductRequest.countDocuments({ status: 'approved' }),
      PendingProductRequest.countDocuments({ status: 'denied' }),
      MarketplaceProduct.countDocuments(),
      MarketplaceProduct.countDocuments({ isPublished: true }),
      MarketplaceProduct.aggregate([
        { $group: { _id: null, total: { $sum: '$purchases' } } }
      ])
    ]);

    // Calculate approval rate
    const reviewedRequests = approvedRequests + deniedRequests;
    const approvalRate = reviewedRequests > 0 
      ? ((approvedRequests / reviewedRequests) * 100).toFixed(1)
      : 0;

    // Get average response time (last 100 reviewed requests)
    const recentReviewed = await PendingProductRequest.find({
      status: { $in: ['approved', 'denied'] },
      reviewedAt: { $exists: true }
    })
    .sort({ reviewedAt: -1 })
    .limit(100);

    let avgResponseTime = 0;
    if (recentReviewed.length > 0) {
      const totalTime = recentReviewed.reduce((sum, req) => {
        const diff = req.reviewedAt - req.createdAt;
        return sum + diff;
      }, 0);
      avgResponseTime = Math.floor(totalTime / recentReviewed.length / (1000 * 60 * 60)); // Hours
    }

    res.json({
      success: true,
      stats: {
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          denied: deniedRequests,
          approvalRate: `${approvalRate}%`
        },
        products: {
          total: totalProducts,
          published: publishedProducts,
          unpublished: totalProducts - publishedProducts
        },
        orders: {
          total: totalOrders.length > 0 ? totalOrders[0].total : 0
        },
        performance: {
          avgResponseTime: `${avgResponseTime}h`
        }
      }
    });
  } catch (error) {
    console.error('[Dev Marketplace] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace statistics'
    });
  }
});

// ==========================================
// POST /api/dev/marketplace/bulk-approve
// Bulk approve requests
// ==========================================
router.post('/marketplace/bulk-approve', async (req, res) => {
  try {
    const { requestIds, reviewNote } = req.body;
    const reviewerId = req.session?.passport?.user?.id || 'SYSTEM';

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request IDs array is required'
      });
    }

    const results = {
      approved: [],
      failed: []
    };

    for (const requestId of requestIds) {
      try {
        const request = await PendingProductRequest.findOne({ requestId });
        
        if (!request || request.status !== 'pending') {
          results.failed.push({ requestId, reason: 'Not found or already reviewed' });
          continue;
        }

        // Update request
        request.status = 'approved';
        request.reviewedBy = reviewerId;
        request.reviewedAt = new Date();
        request.reviewNote = reviewNote || 'Bulk approved';
        await request.save();

        // Create product
        const productId = `PROD_${nanoid(12)}`;
        const product = new MarketplaceProduct({
          productId,
          requestId,
          storeType: 'server',
          guildId: request.guildId,
          guildName: request.guildName,
          guildIcon: request.guildIcon,
          ownerId: request.createdBy,
          ownerUsername: request.creatorUsername,
          category: request.category,
          title: request.title,
          icon: request.icon,
          images: request.images,
          description: request.description,
          price: request.price,
          seller: request.seller,
          deliveryType: request.deliveryType,
          deliveryData: request.deliveryData,
          isActive: true,
          isPublished: false
        });

        await product.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
          io.to(request.createdBy).emit('marketplace:request:approved', {
            requestId,
            productId,
            title: request.title
          });
        }

        results.approved.push({ requestId, productId });
      } catch (error) {
        results.failed.push({ requestId, reason: error.message });
      }
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('[Dev Marketplace] Error bulk approving:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk approve requests'
    });
  }
});

// ==========================================
// POST /api/dev/marketplace/bulk-deny
// Bulk deny requests
// ==========================================
router.post('/marketplace/bulk-deny', async (req, res) => {
  try {
    const { requestIds, reviewNote } = req.body;
    const reviewerId = req.session?.passport?.user?.id || 'SYSTEM';

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request IDs array is required'
      });
    }

    if (!reviewNote) {
      return res.status(400).json({
        success: false,
        error: 'Review note is required for denial'
      });
    }

    const results = {
      denied: [],
      failed: []
    };

    for (const requestId of requestIds) {
      try {
        const request = await PendingProductRequest.findOne({ requestId });
        
        if (!request || request.status !== 'pending') {
          results.failed.push({ requestId, reason: 'Not found or already reviewed' });
          continue;
        }

        // Update request
        request.status = 'denied';
        request.reviewedBy = reviewerId;
        request.reviewedAt = new Date();
        request.reviewNote = reviewNote;
        await request.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
          io.to(request.createdBy).emit('marketplace:request:denied', {
            requestId,
            title: request.title,
            reviewNote: request.reviewNote
          });
        }

        results.denied.push({ requestId });
      } catch (error) {
        results.failed.push({ requestId, reason: error.message });
      }
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('[Dev Marketplace] Error bulk denying:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk deny requests'
    });
  }
});

module.exports = router;

