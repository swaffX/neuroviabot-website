// ==========================================
// Marketplace Socket.IO Events
// ==========================================
// Real-time notifications for marketplace activities

let io;

/**
 * Initialize marketplace events with Socket.IO
 */
function initMarketplaceEvents(socketIO) {
  io = socketIO;
  console.log('[Marketplace Events] Initialized');

  // Socket.IO connection handler for marketplace-specific events
  io.on('connection', (socket) => {
    // Join user-specific room
    socket.on('marketplace:join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`[Marketplace] User ${userId} joined marketplace room`);
    });

    // Join guild-specific marketplace room
    socket.on('marketplace:join-guild', (guildId) => {
      socket.join(`marketplace_guild_${guildId}`);
      console.log(`[Marketplace] Client joined guild marketplace room: ${guildId}`);
    });

    // Join developer room for request notifications
    socket.on('marketplace:join-developers', () => {
      socket.join('marketplace_developers');
      console.log('[Marketplace] Developer joined marketplace room');
    });

    // Leave rooms on disconnect
    socket.on('disconnect', () => {
      console.log(`[Marketplace] Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Emit product request created event to developers
 */
function emitRequestCreated(requestData) {
  if (!io) return;

  io.to('marketplace_developers').emit('marketplace:request:created', {
    ...requestData,
    timestamp: new Date().toISOString()
  });

  console.log(`[Marketplace Events] Request created notification sent: ${requestData.requestId}`);
}

/**
 * Emit product request approved event to guild owner
 */
function emitRequestApproved(userId, requestData) {
  if (!io) return;

  io.to(`user_${userId}`).emit('marketplace:request:approved', {
    ...requestData,
    timestamp: new Date().toISOString()
  });

  console.log(`[Marketplace Events] Request approved notification sent to user ${userId}`);
}

/**
 * Emit product request denied event to guild owner
 */
function emitRequestDenied(userId, requestData) {
  if (!io) return;

  io.to(`user_${userId}`).emit('marketplace:request:denied', {
    ...requestData,
    timestamp: new Date().toISOString()
  });

  console.log(`[Marketplace Events] Request denied notification sent to user ${userId}`);
}

/**
 * Emit product published event to all marketplace viewers
 */
function emitProductPublished(productData) {
  if (!io) return;

  // Broadcast to all connected clients
  io.emit('marketplace:product:published', {
    ...productData,
    timestamp: new Date().toISOString()
  });

  // Also emit to guild-specific room
  if (productData.guildId) {
    io.to(`marketplace_guild_${productData.guildId}`).emit('marketplace:product:published', {
      ...productData,
      timestamp: new Date().toISOString()
    });
  }

  console.log(`[Marketplace Events] Product published notification sent: ${productData.productId}`);
}

/**
 * Emit product purchased event to seller
 */
function emitProductPurchased(sellerId, orderData) {
  if (!io) return;

  io.to(`user_${sellerId}`).emit('marketplace:product:purchased', {
    ...orderData,
    timestamp: new Date().toISOString()
  });

  console.log(`[Marketplace Events] Purchase notification sent to seller ${sellerId}`);
}

/**
 * Emit product updated event
 */
function emitProductUpdated(productData) {
  if (!io) return;

  // Emit to guild-specific room
  if (productData.guildId) {
    io.to(`marketplace_guild_${productData.guildId}`).emit('marketplace:product:updated', {
      ...productData,
      timestamp: new Date().toISOString()
    });
  }

  console.log(`[Marketplace Events] Product updated notification sent: ${productData.productId}`);
}

/**
 * Emit product removed event
 */
function emitProductRemoved(productId, guildId) {
  if (!io) return;

  // Emit to guild-specific room
  if (guildId) {
    io.to(`marketplace_guild_${guildId}`).emit('marketplace:product:removed', {
      productId,
      guildId,
      timestamp: new Date().toISOString()
    });
  }

  console.log(`[Marketplace Events] Product removed notification sent: ${productId}`);
}

/**
 * Emit low stock alert to seller
 */
function emitLowStockAlert(sellerId, productData) {
  if (!io) return;

  io.to(`user_${sellerId}`).emit('marketplace:low-stock', {
    ...productData,
    timestamp: new Date().toISOString()
  });

  console.log(`[Marketplace Events] Low stock alert sent to seller ${sellerId}`);
}

/**
 * Emit request awaiting review reminder to developers
 */
function emitAwaitingReviewReminder(requestData) {
  if (!io) return;

  io.to('marketplace_developers').emit('marketplace:awaiting-review', {
    ...requestData,
    timestamp: new Date().toISOString()
  });

  console.log(`[Marketplace Events] Awaiting review reminder sent: ${requestData.requestId}`);
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  return io;
}

module.exports = {
  initMarketplaceEvents,
  emitRequestCreated,
  emitRequestApproved,
  emitRequestDenied,
  emitProductPublished,
  emitProductPurchased,
  emitProductUpdated,
  emitProductRemoved,
  emitLowStockAlert,
  emitAwaitingReviewReminder,
  getIO
};

