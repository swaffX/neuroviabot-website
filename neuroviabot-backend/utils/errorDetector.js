const { EventEmitter } = require('events');

class ErrorDetector extends EventEmitter {
  constructor() {
    super();
    this.errors = new Map(); // endpoint -> { count, errors: [], lastReset: Date }
    this.threshold = 10; // errors per minute
    this.resetInterval = 60000; // 1 minute in ms
    this.errorHistory = []; // Last 100 errors
    this.maxHistorySize = 100;
    
    // Reset error counts periodically
    setInterval(() => this.resetCounts(), this.resetInterval);
    
    console.log('[ErrorDetector] Initialized with threshold:', this.threshold);
  }

  logError(endpoint, error, context = {}) {
    const timestamp = Date.now();
    const errorData = {
      endpoint,
      message: error.message,
      stack: error.stack,
      context,
      timestamp,
      statusCode: error.statusCode || 500,
      type: this.categorizeError(error)
    };

    // Add to endpoint-specific tracking
    if (!this.errors.has(endpoint)) {
      this.errors.set(endpoint, {
        count: 0,
        errors: [],
        lastReset: timestamp
      });
    }

    const endpointData = this.errors.get(endpoint);
    endpointData.count++;
    endpointData.errors.push(errorData);

    // Keep only last 10 errors per endpoint
    if (endpointData.errors.length > 10) {
      endpointData.errors.shift();
    }

    // Add to global history
    this.errorHistory.push(errorData);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }

    // Check threshold and emit alert
    if (endpointData.count >= this.threshold) {
      this.emit('threshold_exceeded', {
        endpoint,
        count: endpointData.count,
        errors: endpointData.errors
      });
      console.error(`[ErrorDetector] ⚠️ ALERT: ${endpoint} exceeded threshold (${endpointData.count} errors)`);
    }

    console.error(`[ErrorDetector] Error logged for ${endpoint}:`, error.message);
    
    return errorData;
  }

  categorizeError(error) {
    if (error.statusCode) {
      if (error.statusCode >= 400 && error.statusCode < 500) {
        return 'client_error';
      } else if (error.statusCode >= 500) {
        return 'server_error';
      }
    }
    
    if (error.name === 'ValidationError') return 'validation_error';
    if (error.name === 'UnauthorizedError') return 'auth_error';
    if (error.code === 'ECONNREFUSED') return 'connection_error';
    
    return 'unknown_error';
  }

  getErrorStats() {
    const stats = {
      totalEndpoints: this.errors.size,
      endpoints: [],
      recentErrors: this.errorHistory.slice(-20), // Last 20 errors
      errorsByType: {},
      totalErrorsLastMinute: 0
    };

    for (const [endpoint, data] of this.errors.entries()) {
      stats.totalErrorsLastMinute += data.count;
      
      stats.endpoints.push({
        endpoint,
        count: data.count,
        lastError: data.errors[data.errors.length - 1],
        errors: data.errors
      });
    }

    // Count by type
    this.errorHistory.forEach(error => {
      stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
    });

    // Sort endpoints by error count
    stats.endpoints.sort((a, b) => b.count - a.count);

    return stats;
  }

  getRecentErrors(limit = 50) {
    return this.errorHistory.slice(-limit).reverse();
  }

  resetCounts() {
    const now = Date.now();
    for (const [endpoint, data] of this.errors.entries()) {
      // Reset count but keep error history
      data.count = 0;
      data.lastReset = now;
    }
    console.log('[ErrorDetector] Error counts reset');
  }

  clearHistory() {
    this.errorHistory = [];
    this.errors.clear();
    console.log('[ErrorDetector] History cleared');
  }
}

// Singleton instance
let errorDetectorInstance = null;

function getErrorDetector() {
  if (!errorDetectorInstance) {
    errorDetectorInstance = new ErrorDetector();
  }
  return errorDetectorInstance;
}

module.exports = { getErrorDetector };

