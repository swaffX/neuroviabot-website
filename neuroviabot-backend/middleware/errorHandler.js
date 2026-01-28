const { getErrorDetector } = require('../utils/errorDetector');

// Global error handler middleware
function errorHandler(err, req, res, next) {
  const errorDetector = getErrorDetector();
  
  // Log error to detector
  const errorData = errorDetector.logError(req.path, err, {
    method: req.method,
    body: req.body,
    query: req.query,
    user: req.user?.id,
    ip: req.ip,
    requestId: req.requestId
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // User-friendly error messages
  const userMessage = getUserFriendlyMessage(err, statusCode);

  // Log to console for debugging
  console.error(`[ErrorHandler] ${req.method} ${req.path} [${req.requestId || 'N/A'}]:`, err.message);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: userMessage,
    message: process.env.NODE_ENV === 'development' ? err.message : userMessage,
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

// Async route wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Get user-friendly error message
function getUserFriendlyMessage(err, statusCode) {
  if (statusCode === 400) return 'Geçersiz istek. Lütfen gönderdiğiniz verileri kontrol edin.';
  if (statusCode === 401) return 'Yetkilendirme başarısız. Lütfen giriş yapın.';
  if (statusCode === 403) return 'Bu işlem için yetkiniz yok.';
  if (statusCode === 404) return 'İstenen kaynak bulunamadı.';
  if (statusCode === 409) return 'İşlem çakışması. Lütfen tekrar deneyin.';
  if (statusCode === 429) return 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.';
  if (statusCode >= 500) return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
  
  return err.message || 'Bir hata oluştu.';
}

// 404 handler
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Endpoint bulunamadı',
    path: req.path
  });
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler
};

