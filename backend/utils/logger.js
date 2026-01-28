/**
 * Logger utility for structured logging
 * Uses console with structured format for now, can be extended to winston/pino later
 */

const { randomUUID } = require('crypto');

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const requestId = meta.requestId || 'N/A';
    
    return JSON.stringify({
      timestamp,
      level,
      context: this.context,
      requestId,
      message,
      ...meta,
    });
  }

  info(message, meta = {}) {
    console.log(this.formatMessage('INFO', message, meta));
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
    } : {};

    console.error(this.formatMessage('ERROR', message, { ...meta, ...errorMeta }));
  }

  warn(message, meta = {}) {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }

  child(context) {
    return new Logger(`${this.context}:${context}`);
  }
}

// Request ID middleware
function requestIdMiddleware(req, res, next) {
  req.requestId = randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

// Request logger middleware
function requestLoggerMiddleware(logger) {
  return (req, res, next) => {
    const start = Date.now();
    
    // Log request
    logger.info('Incoming request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? 'error' : 'info';
      
      logger[level]('Request completed', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  };
}

// Singleton instance
const defaultLogger = new Logger('NeuroViaBot');

module.exports = {
  Logger,
  logger: defaultLogger,
  requestIdMiddleware,
  requestLoggerMiddleware,
};
