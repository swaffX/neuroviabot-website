const rateLimit = new Map();

module.exports = {
  validateTransaction: (req, res, next) => {
    const { fromUserId, toUserId, amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    // No self-transfers
    if (fromUserId === toUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot transfer to yourself'
      });
    }

    // Rate limiting (max 10 transfers per minute)
    const now = Date.now();
    const userKey = `tx_${fromUserId}`;
    const userLimits = rateLimit.get(userKey) || [];
    const recentTransfers = userLimits.filter(time => now - time < 60000);

    if (recentTransfers.length >= 10) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Max 10 transfers per minute.'
      });
    }

    recentTransfers.push(now);
    rateLimit.set(userKey, recentTransfers);

    // Fraud detection - suspicious patterns
    if (amount > 1000000) {
      console.warn(`[Security] Large transfer detected: ${fromUserId} -> ${toUserId} (${amount} NRC)`);
    }

    next();
  },

  validateMarketplace: (req, res, next) => {
    const { listingId, buyerId, price } = req.body;

    // Validate price
    if (price && (price <= 0 || price > 10000000)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid price range (1-10,000,000 NRC)'
      });
    }

    // Rate limiting for purchases
    const now = Date.now();
    const userKey = `mp_${buyerId}`;
    const userLimits = rateLimit.get(userKey) || [];
    const recentPurchases = userLimits.filter(time => now - time < 60000);

    if (recentPurchases.length >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Max 5 purchases per minute.'
      });
    }

    recentPurchases.push(now);
    rateLimit.set(userKey, recentPurchases);

    next();
  }
};

